package com.office.officemanagement.bookmark;

public class BookmarkImportResult {

    private final int imported;
    private final int skipped;

    public BookmarkImportResult(int imported, int skipped) {
        this.imported = imported;
        this.skipped = skipped;
    }

    public int getImported() {
        return imported;
    }

    public int getSkipped() {
        return skipped;
    }
}
