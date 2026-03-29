import React, { useCallback } from "react";

import {
  ColumnProps,
  Icons,
  Task,
  TaskOrEmpty,
} from "../../../types/public-types";

import { formatTaskTitleWithPic } from "../../../helpers/format-task-title-with-pic";

import styles from "./title-column.module.css";

const getExpanderSymbol = (
  task: TaskOrEmpty,
  hasChildren: boolean,
  isClosed: boolean,
  icons: Partial<Icons> | undefined
) => {
  if (!hasChildren) {
    return icons?.renderNoChildrenIcon ? icons.renderNoChildrenIcon(task) : "";
  }

  if (isClosed) {
    return icons?.renderClosedIcon ? icons.renderClosedIcon(task) : "⊞";
  }

  return icons?.renderOpenedIcon ? icons.renderOpenedIcon(task) : "⊟";
};

export const TitleColumn: React.FC<ColumnProps> = (props) => {
  const {
    data: {
      colors,
      distances: { expandIconWidth, nestedTaskNameOffset },
      icons,
      isShowTaskNumbers,
      hasChildren,
      isClosed,
      depth,
      indexStr,
      task,
      onExpanderClick,
    }
  } = props;
  const { name } = task;

  const taskRow = task.type !== "empty" ? (task as Task) : null;
  const avatarUrl = taskRow?.avatarUrl;
  const displayLabel =
    task.type === "empty"
      ? name
      : formatTaskTitleWithPic(name, taskRow?.shortName);

  const expanderSymbol = getExpanderSymbol(task, hasChildren, isClosed, icons);

  const onClick = useCallback(() => {
    if (task.type !== "empty") {
      onExpanderClick(task);
    }
  }, [onExpanderClick, task]);

  return (
    <div
      data-testid={`title-table-cell-${name}`}
      className={`${styles.taskListNameWrapper}`}
      style={{
        paddingLeft: depth * nestedTaskNameOffset,
      }}
      title={displayLabel}
    >
      <div
        className={`${styles.taskListExpander} ${
          !hasChildren ? styles.taskListEmptyExpander : ""
        }`}
        onClick={onClick}
        style={{
          width: expandIconWidth,
        }}
      >
        {expanderSymbol}
      </div>
      <div
        style={{
          color: colors.barLabelColor,
        }}
        className={`${styles.taskName} ${styles.taskNameWithAvatar}`}
      >
        {isShowTaskNumbers && <b>{indexStr} </b>}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className={styles.taskAvatar}
            width={22}
            height={22}
          />
        ) : null}
        <span className={styles.taskNameText}>{displayLabel}</span>
      </div>
    </div>
  );
};
