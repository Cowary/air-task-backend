package org.cowary.airtaskbackend.rest.core.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CompletedWeeklyDto {
    private Long id;
    private Long weeklyId;
    private LocalDateTime completedDate;
}