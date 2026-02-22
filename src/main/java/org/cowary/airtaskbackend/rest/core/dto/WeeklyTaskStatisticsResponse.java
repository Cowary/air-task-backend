package org.cowary.airtaskbackend.rest.core.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyTaskStatisticsResponse {
    private List<WeeklyWithCompletionStatus> completedTasks;
    private List<WeeklyWithCompletionStatus> incompleteTasks;
    
    @Data
    @Builder
    public static class WeeklyWithCompletionStatus {
        private Long weeklyTaskId;
        private String weeklyTaskName;
        private Integer requiredCount;
        private Integer completedCount;
        private Integer remainingCount;
        private String completionPercentage;
        private Long projectId;
        private String projectName;
        private Boolean completedToday;
    }
}