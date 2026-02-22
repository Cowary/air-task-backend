package org.cowary.airtaskbackend.rest.planka.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
@NoArgsConstructor
@AllArgsConstructor
public class TaskListRs {
    Long id;
    String name;
    Long boardId;
    List<PlankaTaskDtoRs> tasks;
}
