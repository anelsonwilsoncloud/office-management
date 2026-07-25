package com.office.officemanagement.todo;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TodoRepository extends JpaRepository<Todo, Long> {

    List<Todo> findByArchivedTrueOrderByDateDesc();

    // Active (non-archived) listing with optional name search, accomplished filter, and date range.
    @Query("select t from Todo t where t.archived = false "
            + "and (:q is null or lower(t.name) like lower(concat('%', :q, '%'))) "
            + "and (:accomplished is null or t.accomplished = :accomplished) "
            + "and (:fromDate is null or t.date >= :fromDate) "
            + "and (:toDate is null or t.date <= :toDate) "
            + "order by t.date desc")
    List<Todo> searchActive(@Param("q") String q,
                            @Param("accomplished") Boolean accomplished,
                            @Param("fromDate") LocalDate fromDate,
                            @Param("toDate") LocalDate toDate);

    // Past pending: not archived, not accomplished, due strictly before today.
    List<Todo> findByArchivedFalseAndAccomplishedFalseAndDateBeforeOrderByDateDesc(LocalDate today);

    // Future pending: not archived, not accomplished, due within (today, today+N].
    List<Todo> findByArchivedFalseAndAccomplishedFalseAndDateAfterAndDateLessThanEqualOrderByDateAsc(
            LocalDate today, LocalDate until);
}
