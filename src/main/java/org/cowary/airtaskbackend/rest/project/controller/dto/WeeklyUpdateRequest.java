package org.cowary.airtaskbackend.rest.project.controller.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.cowary.airtaskbackend.db.entity.Priority;
import org.cowary.airtaskbackend.db.entity.Status;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyUpdateRequest {
    private String name;
    private Integer count;
    private Priority priority;
    private Status status;
}