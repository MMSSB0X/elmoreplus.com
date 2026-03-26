// gdrive.js - The Ultimate Google Drive Image Converter

export function getDirectImageUrl(url) {
    if (!url) return "";
    
    let fileId = null;
    
    // 1. Check if the link uses the "?id=" format (like the link you just provided!)
    const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
        fileId = idMatch[1];
    } 
    // 2. Check if the link uses the "/file/d/" format (standard share links)
    else {
        const dMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (dMatch && dMatch[1]) {
            fileId = dMatch[1];
        }
    }

    // If we successfully extracted a Google Drive ID, convert it to the magic LH3 server link!
    if (fileId) {
        // This is the bulletproof Google server that forces images to display anywhere
        return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
    
    // If it's a normal link (Imgur, Discord, placehold.co), just return it normally
    return url;
}