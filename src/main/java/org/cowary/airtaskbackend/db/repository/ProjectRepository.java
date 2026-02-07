package org.cowary.airtaskbackend.db.repository;

import org.cowary.airtaskbackend.db.entity.ProjectEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<ProjectEntity, Long> {

    @Query("SELECT DISTINCT p FROM ProjectEntity p LEFT JOIN FETCH p.weeklyEntityList")
    List<ProjectEntity> findAllWithWeeklyTasks();
}
