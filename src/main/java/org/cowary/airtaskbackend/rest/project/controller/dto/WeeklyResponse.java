package org.cowary.airtaskbackend.rest.project.controller.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.cowary.airtaskbackend.db.entity.Priority;
import org.cowary.airtaskbackend.db.entity.Status;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyResponse {
    private Long id;
    private String name;
    private Integer count;
    private Long projectId;
    private Priority priority;
    private Status status;
    private LocalDateTime createdTs;
    private LocalDateTime updatedTs;
}