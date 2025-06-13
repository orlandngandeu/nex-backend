import { Injectable, InternalServerErrorException } from "@nestjs/common"
import  { Utilisateur } from "../auth/auth.entity"
import  { Contract } from "../contrat/entities/contrat.entity"
import * as nodemailer from 'nodemailer'
import axios from 'axios'

@Injectable()
export class NotificationService {
  private transporter: nodemailer.Transporter;
  // Cache pour stocker les noms de lieux déjà recherchés
  private locationCache: Map<string, string> = new Map();

  constructor(
   
  ) {
    // Création du transporteur Nodemailer
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '465'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

 
  async sendCommentNotification(user: Utilisateur, commentaire: string): Promise<void> {
    // Envoi direct de l'email sans stockage en BD
    await this.sendEmail(
      user.email,
      "Nouveau commentaire reçu",
      `
        <p>Bonjour ${user.nom},</p>
        <p>Un nouveau commentaire a été posté :</p>
        <blockquote>${commentaire}</blockquote>
        <p>Cordialement,<br>L'équipe de gestion</p>
      `,
    )
  }

  // Fonction pour générer une clé de cache basée sur les coordonnées
  private getLocationCacheKey(latitude: number, longitude: number): string {
    return `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
  }

  // Fonction pour convertir des coordonnées en nom de lieu avec plusieurs API et gestion d'erreurs
  private async getLocationName(coordinates: number[]): Promise<string> {
    if (!coordinates || coordinates.length !== 2) {
      return 'Lieu non spécifié';
    }
    
    const [latitude, longitude] = coordinates;
    const cacheKey = this.getLocationCacheKey(latitude, longitude);
    
    // Vérifier si le résultat est déjà en cache
    const cached = this.locationCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Liste des API de géocodage à essayer (dans l'ordre)
    const geocodingApis = [
      this.tryNominatimApi.bind(this),      // OpenStreetMap (gratuit)
      this.tryBigDataCloudApi.bind(this),   // API alternative
      this.tryPositionStackApi.bind(this)   // Autre API alternative
    ];
    
    // Essayer chaque API jusqu'à ce qu'une fonctionne
    for (const apiFunction of geocodingApis) {
      try {
        const locationName = await apiFunction(latitude, longitude);
        if (locationName) {
          // Mettre en cache le résultat pour une utilisation future
          this.locationCache.set(cacheKey, locationName);
          return locationName;
        }
      } catch (error) {
        console.error(`Erreur avec une API de géocodage: ${error.message || error}`);
        // Continuer avec la prochaine API
      }
    }
    
    // Si toutes les API échouent, retourner les coordonnées formatées
    const formattedCoordinates = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    this.locationCache.set(cacheKey, formattedCoordinates);
    return formattedCoordinates;
  }
  
  // API Nominatim (OpenStreetMap)
  private async tryNominatimApi(latitude: number, longitude: number): Promise<string> {
    const MAX_RETRIES = 3;
    const INITIAL_TIMEOUT = 5000;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const timeout = INITIAL_TIMEOUT * attempt;
        const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
          params: {
            lat: latitude,
            lon: longitude,
            format: 'json',
            zoom: 10, // Niveau de détail réduit pour des résultats plus rapides
            addressdetails: 1
          },
          headers: {
            'User-Agent': 'GestionApp/1.0 (contact@votre-domaine.com)',
            'Accept-Language': 'fr'
          },
          timeout
        });
        
        if (response.data?.address) {
          const { address } = response.data;
          const parts = [
            address.village,
            address.town,
            address.city,
            address.municipality,
            address.county,
            address.state,
            address.country
          ].filter(Boolean);
          
          return parts.join(', ') || 'Lieu inconnu';
        }
        
        return response.data?.display_name || 'Lieu inconnu';
        
      } catch (error) {
        if (attempt === MAX_RETRIES) {
          console.error(`Échec après ${MAX_RETRIES} tentatives avec Nominatim API`, error);
          throw error;
        }
        // Attente exponentielle avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    return 'Lieu inconnu';
  }
  
  // API BigDataCloud (alternative)
  private async tryBigDataCloudApi(latitude: number, longitude: number): Promise<string> {
    try {
      const response = await axios.get(`https://api.bigdatacloud.net/data/reverse-geocode-client`, {
        params: {
          latitude,
          longitude,
          localityLanguage: 'fr'
        },
        timeout: 5000
      });
      
      if (response.data) {
        const { locality, city, principalSubdivision, countryName } = response.data;
        
        if (locality && countryName) {
          return `${locality}, ${countryName}`;
        } else if (city && countryName) {
          return `${city}, ${countryName}`;
        } else if (principalSubdivision && countryName) {
          return `${principalSubdivision}, ${countryName}`;
        } else if (countryName) {
          return countryName;
        }
      }
      
      return "lieu inconue";
    } catch (error) {
      console.error('Erreur avec BigDataCloud API:', error.message || error);
      throw error;
    }
  }
  
  // API PositionStack (autre alternative - nécessite une clé API)
  private async tryPositionStackApi(latitude: number, longitude: number): Promise<string> {
    // Si vous n'avez pas de clé API PositionStack, cette méthode échouera
    // Vous pouvez en obtenir une gratuitement sur https://positionstack.com/
    const apiKey = process.env.POSITIONSTACK_API_KEY;
    if (!apiKey) {
      throw new Error('Clé API PositionStack non configurée');
    }
    
    try {
      const response = await axios.get(`http://api.positionstack.com/v1/reverse`, {
        params: {
          access_key: apiKey,
          query: `${latitude},${longitude}`,
          limit: 1
        },
        timeout: 5000
      });
      
      if (response.data && response.data.data && response.data.data.length > 0) {
        const location = response.data.data[0];
        if (location.locality && location.country) {
          return `${location.locality}, ${location.country}`;
        } else if (location.region && location.country) {
          return `${location.region}, ${location.country}`;
        } else if (location.country) {
          return location.country;
        }
      }
      
      return "lieu inconue";
    } catch (error) {
      console.error('Erreur avec PositionStack API:', error.message || error);
      throw error;
    }
  }

  async sendContractNotification(user: Utilisateur, contract: Contract): Promise<void> {
    // Version robuste pour obtenir le nom du lieu
    let locationName;
    try {
      locationName = await this.getLocationName(contract.lieu);
    } catch (error) {
      console.error('Impossible de résoudre le nom du lieu, utilisation des coordonnées brutes', error);
      locationName = contract.lieu ? `${contract.lieu[0]}, ${contract.lieu[1]}` : 'Lieu non spécifié';
    }
    
    // Envoi direct de l'email sans stockage en BD
    await this.sendEmail(
      user.email,
      "Nouveau contrat assigné",
      `
      <h1>Nouveau contrat assigné</h1>
      <p>Bonjour ${user.nom},</p>
      <p>Un nouveau contrat vous a été assigné avec les détails suivants :</p>
      <ul>
        <li><strong>Lieu :</strong> ${locationName}</li>
        <li><strong>Poste :</strong> ${contract.poste}</li>
        <li><strong>Horaire de début :</strong> ${new Date(contract.horaireDebut).toLocaleString()}</li>
        <li><strong>Horaire de fin :</strong> ${new Date(contract.horaireFin).toLocaleString()}</li>
      </ul>
      <p>Veuillez vous connecter à votre compte pour plus de détails.</p>
      <p>Cordialement,<br>L'équipe de gestion</p>
      `,
    )
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!to) {
      console.warn("Aucun email destinataire fourni");
      return;
    }

    try {
      const fromEmail = process.env.EMAIL_FROM || "Gestion <noreply@example.com>";
      
      const info = await this.transporter.sendMail({
        from: fromEmail,
        to,
        subject,
        html,
        text: this.htmlToPlainText(html),
      });

      console.log(`Email envoyé à ${to}`, info.messageId);
    } catch (error) {
      console.error("Erreur d'envoi d'email:", error);
      throw error;
    }
  }

  // Fonction utilitaire pour convertir HTML en texte brut
  private htmlToPlainText(html: string): string {
    return html
      .replace(/<style[^>]*>.*<\/style>/g, "")
      .replace(/<script[^>]*>.*<\/script>/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim()
  }

  async sendTaskNotification(user: Utilisateur, title: string, action: string): Promise<void> {
    // Envoi direct de l'email sans stockage en BD
    await this.sendEmail(
      user.email,
      `Notification de tâche: ${action}`,
      `
        <h1>Notification de tâche</h1>
        <p>Bonjour ${user.nom},</p>
        <p>${action}:</p>
        <blockquote>${title}</blockquote>
        <p>Veuillez vous connecter à votre compte pour plus de détails.</p>
        <p>Cordialement,<br>L'équipe de gestion</p>
      `,
    );
  }

  // Méthode privée pour envoyer l'email de réinitialisation
  async envoyerEmailReinitialisation(email: string, token: string, nom: string): Promise<void> {
    const urlReinitialisation = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reinitialiser-mot-de-passe?token=${token}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Réinitialisation de mot de passe</h2>
          <p>Bonjour ${nom},</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
          <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
          <a href="${urlReinitialisation}" 
             style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
            Réinitialiser mon mot de passe
          </a>
          <p>Ce lien est valide pendant 1 heure.</p>
          <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
          <p>Cordialement,<br>L'équipe de support</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Email de réinitialisation envoyé à:', email);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      throw new InternalServerErrorException('Erreur lors de l\'envoi de l\'email de réinitialisation.');
    }
  }
}