import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config(); // carga .env

export const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: false, // nunca en producción
    logging: true,
};

export const AppDataSource = new DataSource(dataSourceOptions);
