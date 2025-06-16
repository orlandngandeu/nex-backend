import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async set(key: string, value: any, ttl: number): Promise<void> {
    // TTL en millisecondes pour cache-manager-redis-store
    await this.cacheManager.set(key, value, ttl * 1000);
  }

  async get(key: string): Promise<any> {
    return await this.cacheManager.get(key);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  // Méthode pour vérifier si une clé existe
  async exists(key: string): Promise<boolean> {
    const value = await this.cacheManager.get(key);
    return value !== undefined && value !== null;
  }

  // Méthode pour obtenir le TTL restant
  async getTtl(key: string): Promise<number> {
    // Cette méthode peut varier selon l'implémentation Redis
    const redis = (this.cacheManager as any).store.getClient();
    return await redis.ttl(key);
  }
}