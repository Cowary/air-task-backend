package org.cowary.airtaskbackend.rest.core.dto;

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
public class ProjectUpdateRequest {
    private String name;
    private Status status;
    private Priority priority;
}