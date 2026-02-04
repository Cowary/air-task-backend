package org.cowary.airtaskbackend.db.repository;

import org.cowary.airtaskbackend.db.entity.ProjectEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectRepository extends JpaRepository<ProjectEntity, Long> {
}
