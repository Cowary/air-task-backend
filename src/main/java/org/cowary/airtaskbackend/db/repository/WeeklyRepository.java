package org.cowary.airtaskbackend.db.repository;

import org.cowary.airtaskbackend.db.entity.WeeklyEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WeeklyRepository extends JpaRepository<WeeklyEntity, Long> {
}
