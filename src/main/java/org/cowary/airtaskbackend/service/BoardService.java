package org.cowary.airtaskbackend.service;

import org.cowary.airtaskbackend.model.planko.GetBoard200ResponseIncludedCardsInner;
import org.cowary.airtaskbackend.model.planko.ModelList;
import org.cowary.airtaskbackend.rest.planka.controller.dto.planka.BoardRs;
import org.cowary.airtaskbackend.rest.planka.controller.dto.planka.TaskListRs;

import java.util.List;

public interface BoardService {

    public List<BoardRs> getAllBoardByProject(Long projectId);

    public List<TaskListRs> getTaskList(Long boardId, List<ModelList> taskList, List<GetBoard200ResponseIncludedCardsInner> cardList);
}
