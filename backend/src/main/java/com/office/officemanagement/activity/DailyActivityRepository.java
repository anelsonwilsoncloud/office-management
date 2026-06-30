package com.office.officemanagement.activity;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DailyActivityRepository extends JpaRepository<DailyActivity, Long> {

    List<DailyActivity> findByArchivedFalseOrderByIdDesc();

    List<DailyActivity> findByArchivedTrueOrderByIdDesc();
}
