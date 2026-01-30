package org.cowary.airtaskbackend.controller.dto;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProjectListDtoRs {
    List<ProjectDtoRs> projectList;
}
