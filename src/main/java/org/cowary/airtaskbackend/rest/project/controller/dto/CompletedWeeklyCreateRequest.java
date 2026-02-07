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
public class CompletedWeeklyCreateRequest {
    private Long weeklyEntityId;
    private LocalDateTime completedDate;
}