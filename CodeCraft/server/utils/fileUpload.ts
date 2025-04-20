import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import fileUpload from 'express-fileupload';
import { Request } from 'express';
import { log } from '../vite';

// Define the interface for uploaded file data
interface UploadedFile {
  filePath: string;
  fileName: string;
  fileUrl: string;
}

/**
 * Save a file to the server's filesystem
 * @param file The uploaded file
 * @param subfolder Optional subfolder within uploads directory
 * @param prefix Optional prefix for the filename (e.g. username)
 * @returns Object with file path, name and URL
 */
export async function saveFile(file: any, subfolder: string = '', prefix: string = ''): Promise<UploadedFile> {
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Create subfolder if provided
  let targetDir = uploadsDir;
  if (subfolder) {
    targetDir = path.join(uploadsDir, subfolder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
  }
  
  // Generate unique filename with optional prefix to prevent conflicts
  const fileExt = path.extname(file.name);
  const sanitizedPrefix = prefix ? 
    prefix.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' : 
    '';
  const fileName = `${sanitizedPrefix}${uuidv4()}${fileExt}`;
  const filePath = path.join(targetDir, fileName);
  
  // Remove previous file with same prefix if it exists
  if (prefix) {
    try {
      const files = fs.readdirSync(targetDir);
      const userPreviousFiles = files.filter(file => 
        file.startsWith(sanitizedPrefix) && file !== fileName
      );
      
      // Delete previous files with same prefix
      for (const oldFile of userPreviousFiles) {
        const oldFilePath = path.join(targetDir, oldFile);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          log(`Deleted previous file: ${oldFile}`, 'fileUpload');
        }
      }
    } catch (error) {
      log(`Error deleting previous files: ${(error as Error).message}`, 'fileUpload');
      // Continue even if cleanup fails
    }
  }
  
  // Save the file
  await file.mv(filePath);
  
  // Construct the URL path for the file
  const fileUrl = `/uploads${subfolder ? `/${subfolder}` : ''}/${fileName}`;
  
  log(`File saved successfully: ${fileName}`, 'fileUpload');
  
  return {
    filePath,
    fileName,
    fileUrl
  };
}

/**
 * Get a file from a request's files object by field name
 * @param req Express request object
 * @param fieldName Form field name containing the file
 * @returns The uploaded file or null if not found
 */
export function getFileFromRequest(req: Request, fieldName: string): any {
  try {
    if (!req.files) {
      return null;
    }
    
    // Type assertion - we know req.files exists at this point
    const files = req.files as any;
    
    if (!files[fieldName]) {
      return null;
    }
    
    // Handle case when multiple files are uploaded with the same field name
    if (Array.isArray(files[fieldName])) {
      return files[fieldName][0];
    }
    
    return files[fieldName];
  } catch (error) {
    console.error('Error getting file from request:', error);
    return null;
  }
}

/**
 * Validate if a file is an image
 * @param file The uploaded file
 * @returns boolean indicating if file is a valid image
 */
export function validateImageFile(file: any): boolean {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  return allowedTypes.includes(file.mimetype);
}

/**
 * Validate if a file is a document
 * @param file The uploaded file
 * @returns boolean indicating if file is a valid document
 */
export function validateDocumentFile(file: any): boolean {
  const allowedTypes = [
    'application/pdf',                                                        // PDF
    'application/msword',                                                    // DOC
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/vnd.ms-excel',                                              // XLS
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',     // XLSX
    'text/plain'                                                             // TXT
  ];
  return allowedTypes.includes(file.mimetype);
}