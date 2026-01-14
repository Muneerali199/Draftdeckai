# Developer Change Log - PDF & Formatting Fixes
**Date:** January 11, 2026

## Overview
This document outlines the changes made to the "Cover Letter" functionality to resolve issues with PDF generation (squished text on mobile, poor formatting) and runtime errors.

## 1. Migration to `@react-pdf/renderer`
**Problem:** The previous `html2canvas` + `jsPDF` approach relied on taking a screenshot of the DOM. This caused inconsistencies where the PDF looked different depending on the user's screen size (viewport squishing) and resulted in massive file sizes for text documents.

**Solution:**
Replaced the export logic with `@react-pdf/renderer`.
-   **Library Used:** `@react-pdf/renderer` (v3.1.x)
-   **Key Benefit:** Generates true vector-based PDFs that follow strict A4 sizing regardless of the device used to generate them.

### New Components
-   `components/letter/pdf-template.tsx`: A dedicated, invisible React component that defines the PDF structure.
    -   Includes a **Custom Markdown Parser**: Manually parses `**bold**` text and unordered lists (`*` or `-`) to ensure they render correctly in the PDF `View` primitives.
    -   Uses standard **Times-Roman** font for professional appearance.

### Modified Files
-   `components/letter/letter-dashboard.tsx`:
    -   Removed `html2canvas` and `jspdf` logic.
    -   Added `exportToPDF` function that dynamically imports the renderer (to avoid SSR issues) and generates a client-side Blob.
    -   **Dynamic Filenames**: Now uses the letter's Subject line (e.g., `Application_for_Google.pdf`) instead of a generic name.

## 2. Infrastructure & Security Fixes
**Problem:** The PDF renderer uses a WebAssembly module (`yoga-wasm`) which requires loading a `data:` URI. The app's Strict Content Security Policy (CSP) blocked this.
**Fix:**
-   Updated `lib/security.ts`: Added `data:` to the `connect-src` directive in the CSP configuration.
-   Updated `middleware.ts`: Verified it consumes the updated config.

**Problem:** `ReactMarkdown` threw a "Usage of className prop" error due to a deprecated API in v9+.
**Fix:**
-   Updated `components/letter/letter-preview.tsx`: Moved all styling classes from the `<ReactMarkdown>` component to a wrapper `<div>`.

## 3. Helper Scripts
### Credit Refill Script
**Location:** `scripts/add-credits.cjs`
**Usage:** `node scripts/add-credits.cjs`
**Purpose:**
-   Connects to Supabase using service role keys.
-   Finds the user (hardcoded as `gca1245@gmail.com` but easily changeable).
-   Updates the `user_credits` table to set:
    -   `credits_total` = 1000
    -   `credits_used` = 0
-   **Note:** Useful for local development when testing limits.

## Summary of Files Touched
1.  `package.json` (Added `@react-pdf/renderer`)
2.  `components/letter/letter-dashboard.tsx` (Export logic)
3.  `components/letter/pdf-template.tsx` (New file)
4.  `components/letter/letter-preview.tsx` (Fix crash)
5.  `lib/security.ts` (Fix CSP)
6.  `middleware.ts` (Import CSP)
7.  `scripts/add-credits.cjs` (New tool)
