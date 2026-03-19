import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config(); // carga .env

// SSL por defecto para hosts remotos (evita "no encryption" en servidores que lo exigen)
const host = process.env.DB_HOST ?? '';
const useSsl =
  process.env.DB_SSL === 'true' ||
  process.env.DB_SSL === '1' ||
  (host !== 'localhost' && host !== '127.0.0.1' && host !== '');

export const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    schema: 'finance',
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    extra: {
        options: '-c search_path=finance,public'
    },
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: false, // nunca en producción
    logging: true,
};

export const AppDataSource = new DataSource(dataSourceOptions);
