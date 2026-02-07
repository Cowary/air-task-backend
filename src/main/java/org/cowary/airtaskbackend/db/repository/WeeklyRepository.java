package org.cowary.airtaskbackend.db.repository;

import org.cowary.airtaskbackend.db.entity.WeeklyEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WeeklyRepository extends JpaRepository<WeeklyEntity, Long> {

    List<WeeklyEntity> findByProjectId(Long projectId);

    List<WeeklyEntity> findByProjectIdAndStatus(Long projectId, String status);
}
