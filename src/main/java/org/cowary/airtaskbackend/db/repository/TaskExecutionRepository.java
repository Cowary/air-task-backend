package org.cowary.airtaskbackend.db.repository;

import org.cowary.airtaskbackend.db.entity.TaskExecution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskExecutionRepository extends JpaRepository<TaskExecution, Long> {
}
