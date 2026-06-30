package com.office.officemanagement.learning;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TechnicalLearningRepository extends JpaRepository<TechnicalLearning, Long> {

    List<TechnicalLearning> findByArchivedFalseOrderByIdDesc();

    List<TechnicalLearning> findByArchivedTrueOrderByIdDesc();
}
