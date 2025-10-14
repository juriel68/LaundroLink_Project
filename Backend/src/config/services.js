import { v2 as cloudinary } from "cloudinary";
import Paymongo from 'paymongo-node';
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

// --- SendGrid Mail ---
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// --- PayMongo ---
export const paymongo = new Paymongo(process.env.PAYMONGO_SECRET_KEY); 

// --- Cloudinary ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary, sgMail };