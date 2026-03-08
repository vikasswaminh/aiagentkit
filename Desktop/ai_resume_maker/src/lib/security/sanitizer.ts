/**
 * Enhanced server-side HTML/String sanitizer.
 * Uses a more comprehensive approach to prevent XSS.
 */

// Entity encode special HTML characters
function htmlEncode(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

// Strip all HTML tags more robustly
function stripAllTags(str: string): string {
    // Pass: Remove all tags including malformed ones
    const result = str
        // Handle self-closing tags
        .replace(/<[^>]*\/\s*>/gi, '')
        // Handle opening/closing tags (greedy, handles nested malformed tags)
        .replace(/<[^>]*>/gi, '')
        // Handle unclosed tags at the end
        .replace(/<[^>]*$/gi, '')
        // Handle orphaned closing brackets
        .replace(/^[^<]*>/gi, '');

    return result;
}

// Remove dangerous URL schemes
function sanitizeUrls(str: string): string {
    return str
        .replace(/javascript\s*:/gi, '')
        .replace(/data\s*:/gi, '')
        .replace(/vbscript\s*:/gi, '');
}

/**
 * Sanitizes a string by removing/encoding all HTML.
 * This is a "strip everything" approach suitable for plain text fields.
 */
export function sanitizeString(str: string): string {
    if (!str) return str;

    let sanitized = str;

    // 1. Remove all event handlers (any on* attribute pattern)
    sanitized = sanitized.replace(/\bon\w+\s*=\s*(['"])[^'"]*\1/gi, '');
    sanitized = sanitized.replace(/\bon\w+\s*=\s*[^\s>]+/gi, '');

    // 2. Remove dangerous URL schemes
    sanitized = sanitizeUrls(sanitized);

    // 3. Strip all HTML tags
    sanitized = stripAllTags(sanitized);

    // 4. Return the "lean" string. 
    // IMPORTANT: We do NOT call htmlEncode here because React components 
    // automatically encode content during rendering. Double-encoding 
    // leads to literal entities (like &#x27;) being displayed in the PDF/UI.
    return sanitized.trim();
}

/**
 * Deeply sanitizes a resume data object.
 */
export function sanitizeResumeData(data: unknown): unknown {
    if (typeof data === "string") {
        return sanitizeString(data);
    }

    if (Array.isArray(data)) {
        return data.map(item => sanitizeResumeData(item));
    }

    if (data !== null && typeof data === "object") {
        const sanitized: Record<string, unknown> = {};
        for (const key in data) {
            sanitized[key] = sanitizeResumeData((data as Record<string, unknown>)[key]);
        }
        return sanitized;
    }

    return data;
}

/**
 * Sanitize a filename for Content-Disposition header.
 * Only allows alphanumeric, underscore, hyphen.
 */
export function sanitizeFilename(name: string): string {
    if (!name) return "Untitled";
    return name
        .replace(/[^a-zA-Z0-9_\- ]/g, '') // Remove all special chars except space, underscore, hyphen
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .slice(0, 50) // Limit length
        || "Untitled";
}
