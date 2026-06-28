package com.office.officemanagement.bookmark;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {

    List<Bookmark> findByArchivedFalseOrderByNameAsc();

    List<Bookmark> findByArchivedTrueOrderByNameAsc();

    boolean existsByUrl(String url);

    @Query("select b from Bookmark b where b.archived = false and ("
            + "lower(b.name) like lower(concat('%', :q, '%')) or "
            + "lower(coalesce(b.additionalInfo, '')) like lower(concat('%', :q, '%'))) "
            + "order by b.name asc")
    List<Bookmark> searchActive(@Param("q") String q);
}
