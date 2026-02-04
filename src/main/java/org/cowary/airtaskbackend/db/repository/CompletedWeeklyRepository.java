package org.cowary.airtaskbackend.db.repository;

import org.cowary.airtaskbackend.db.entity.CompletedWeeklyEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CompletedWeeklyRepository extends JpaRepository<CompletedWeeklyEntity, Long> {
}
