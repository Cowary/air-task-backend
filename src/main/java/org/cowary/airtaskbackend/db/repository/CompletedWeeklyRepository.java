package org.cowary.airtaskbackend.db.repository;

import org.cowary.airtaskbackend.db.entity.CompletedWeeklyEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CompletedWeeklyRepository extends JpaRepository<CompletedWeeklyEntity, Long> {
    List<CompletedWeeklyEntity> findByWeeklyEntityId(Long weeklyId);

    @Query("SELECT c FROM CompletedWeeklyEntity c WHERE c.completedDate >= :startOfWeek AND c.completedDate < :endOfWeek")
    List<CompletedWeeklyEntity> findCompletedThisWeek(@Param("startOfWeek") LocalDateTime startOfWeek, @Param("endOfWeek") LocalDateTime endOfWeek);
}
