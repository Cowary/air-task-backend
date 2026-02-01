package org.cowary.airtaskbackend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.cowary.airtaskbackend.api.planko.BoardsApi;
import org.cowary.airtaskbackend.controller.dto.BoardRs;
import org.cowary.airtaskbackend.controller.dto.TaskDtoRs;
import org.cowary.airtaskbackend.controller.dto.TaskListRs;
import org.cowary.airtaskbackend.model.planko.GetBoard200ResponseIncludedCardsInner;
import org.cowary.airtaskbackend.model.planko.ModelList;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

public interface BoardService {

    public List<BoardRs> getAllBoardByProject(Long projectId);

    public List<TaskListRs> getTaskList(Long boardId, List<ModelList> taskList, List<GetBoard200ResponseIncludedCardsInner> cardList);
}
