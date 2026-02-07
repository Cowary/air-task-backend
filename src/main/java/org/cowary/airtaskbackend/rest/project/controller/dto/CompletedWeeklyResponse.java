package org.cowary.airtaskbackend.rest.project.controller.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompletedWeeklyResponse {
    private Long id;
    private Long weeklyEntityId;
    private String weeklyEntityName;
    private LocalDateTime completedDate;
    private LocalDateTime createdTs;
    private LocalDateTime updatedTs;
}