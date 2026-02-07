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
public class ProjectCreateRequest {
    private String name;
    private Status status;
    private Priority priority;
}