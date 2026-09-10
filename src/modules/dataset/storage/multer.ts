import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs";
import { envConfig } from "../../../config";

const uploadDir = path.join(process.cwd(), "uploads");
fs.mkdirSync(uploadDir, { recursive: true })

const allowedMimeTypes = [
    "text/csv",
    "application/vnd.ms-excel",
];
const { fileSizeLimit, fileType } = envConfig.multer

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        cb(null, uploadDir); // Specify the destination folder for uploaded files
    },
    filename: (req, file, cb) => {
        crypto.randomBytes(16, function (err, raw) {
            if (err) return cb(err, file.fieldname);
            cb(null, `${file.fieldname}-${raw.toString('hex')}`)
        })
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: fileSizeLimit, // 50 MB
    },
    fileFilter: (req, file, cb) => {
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return cb(new Error("Only CSV files are allowed"));
        }

        cb(null, true);
    },
});

export default upload;