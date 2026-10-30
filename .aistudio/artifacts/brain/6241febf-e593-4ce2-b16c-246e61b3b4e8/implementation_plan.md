# Implementation Plan - Fix PDF Preview and Download in Step 3

## Problem Statement
In Step 3 (Upload Supporting Documents) of the AICTE FDR Portal, the uploaded documents show "Uploaded & Stored" and persist across refreshes, but clicking the **Preview** button does nothing, and **Download** needs robust verification to ensure it fetches the actual uploaded file with the correct original filename and content without corruption.

## Proposed Changes

### 1. Robust PDF Preview Modal (`src/components/FDRSubmissionDesk.tsx`)
- Implement a dedicated PDF Preview Modal that opens when clicking the Preview button for any of the 3 mandatory documents (Original FDR Certificate, Bank Lien Endorsement Letter, Trust Board Resolution).
- Handle asynchronous loading with a loading spinner and blob URL generation from the stored base64 or backend storage URL (`/uploads/fdr_documents/...`).
- Properly revoke temporary Blob URLs when closing the modal (`URL.revokeObjectURL`).
- Provide error handling if document retrieval fails.
- Include a modal header with the document title, file size, download button, and close (`X`) button, and an `iframe` or `embed` element rendering the PDF blob.

### 2. Verified PDF Download Functionality
- Ensure the Download button fetches the document data (or uses base64 / blob URL), creates an anchor element with `download="Original_FDR_Certificate.pdf"`, and triggers the download programmatically.
- Verify that the downloaded file is non-empty and correctly formatted as a PDF (`%PDF-`).

### 3. Verification & Testing
- Run `tsc --noEmit` and build via `npm run build` to ensure zero compilation errors.
- Test preview and download for all 3 document types.
