package org.cowary.airtaskbackend.service;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.cowary.airtaskbackend.db.entity.TaskExecution;
import org.cowary.airtaskbackend.db.repository.TaskExecutionRepository;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true)
public class TaskExecutionService {
    TaskExecutionRepository taskExecutionRepository;

    public TaskExecution create(String name, Long duration, Long plankaTaskId) {
        var taskExecution = taskExecutionRepository.save(TaskExecution.builder()
                .taskName(name)
                .duration(duration)
                .plankaTaskId(plankaTaskId)
                .build());
        log.info("Task execution created: {}", taskExecution);
        return taskExecution;
    }
}
