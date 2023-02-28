import { useCallback } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Link from "@mui/material/Link";
import { CircularProgress, Theme } from "@mui/material";
import styled from "@emotion/styled";
import CancelledIcon from "@mui/icons-material/HighlightOffRounded";
import SuccessIcon from "@mui/icons-material/CheckCircleRounded";

import getGelatoTaskInfo from "src/api/getGelatoTaskInfo";
import useApi from "src/hooks/useApi";
import { GelatoTask } from "src/models/gelatoTask";
import AddressLabel from "src/components/address-label/AddressLabel";
import getChain from "src/utils/getChain";

type GelatoTaskStatusLabelProps = {
  gelatoTaskId: string;
  chainId: string;
};

const pollingTime = 4_000; // 4 seconds of polling time to update the Gelato task status

const GelatoTaskStatusLabel = ({
  gelatoTaskId,
  chainId,
}: GelatoTaskStatusLabelProps) => {
  const fetchGelatoTaskInfo = useCallback(
    (signal: AbortSignal) => getGelatoTaskInfo(gelatoTaskId, { signal }),
    [gelatoTaskId]
  );

  const { data: gelatoTaskInfo } = useApi(fetchGelatoTaskInfo, pollingTime);

  const chain = getChain(chainId);

  const isCancelled = gelatoTaskInfo?.taskState === "Cancelled";
  const isSuccess = gelatoTaskInfo?.taskState === "ExecSuccess";
  const isLoading = !isCancelled && !isSuccess;

  return (
    <Container
      component={Paper}
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={2}
    >
      <Typography variant="h6" component="h2">
        Gelato Task details
      </Typography>
      {/* Status label */}
      {gelatoTaskInfo?.taskState ? (
        <StatusContainer taskStatus={gelatoTaskInfo.taskState}>
          <Typography variant="body2">
            {getGelatoTaskStatusLabel(gelatoTaskInfo.taskState)}
          </Typography>
        </StatusContainer>
      ) : (
        <Skeleton variant="text" width={100} height={20} />
      )}

      {/* Status indicator */}
      <Stack display="flex" justifyContent="center">
        {/* Cancelled Icon */}
        {isCancelled && <CancelledIcon color="error" fontSize="large" />}

        {/* Success Icon */}
        {isSuccess && <SuccessIcon color="success" fontSize="large" />}

        {/* Loading Icon */}
        {isLoading && <CircularProgress />}
      </Stack>

      {/* Transaction hash */}
      {!isCancelled && (
        <Stack
          display="flex"
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          gap={2}
        >
          <Typography variant="body2">Transaction: </Typography>

          {gelatoTaskInfo?.transactionHash ? (
            <Link
              href={`${chain?.blockExplorerUrl}/tx/${gelatoTaskInfo?.transactionHash}`}
              target="_blank"
            >
              <AddressLabel address={gelatoTaskInfo.transactionHash} />
            </Link>
          ) : (
            <Skeleton variant="text" width={150} height={20} />
          )}
        </Stack>
      )}

      {/* Task extra info */}
      {gelatoTaskInfo?.lastCheckMessage && (
        <Typography variant="caption">
          {gelatoTaskInfo.lastCheckMessage}
        </Typography>
      )}
    </Container>
  );
};

export default GelatoTaskStatusLabel;

const Container = styled(Box)`
  max-width: 800px;
  margin: 0 auto;
  margin-top: 24px;
  padding: 16px;
`;

const StatusContainer = styled("div")<{
  theme?: Theme;
  taskStatus: GelatoTask["taskState"];
}>(
  ({ theme, taskStatus }) => `
    margin-right: 8px;
    border-radius: 4px;
    padding: 4px 12px;
    background-color: ${getGelatoTaskStatusColor(taskStatus, theme)};
    color: ${theme.palette.getContrastText(
      getGelatoTaskStatusColor(taskStatus, theme)
    )};
    `
);

const getGelatoTaskStatusColor = (
  taskStatus: GelatoTask["taskState"],
  theme: Theme
) => {
  const colors: Record<GelatoTask["taskState"], string> = {
    CheckPending: theme.palette.warning.light,
    WaitingForConfirmation: theme.palette.info.light,
    ExecPending: theme.palette.info.light,
    ExecSuccess: theme.palette.success.light,
    Cancelled: theme.palette.error.light,
  };

  return colors[taskStatus];
};

const getGelatoTaskStatusLabel = (taskStatus: GelatoTask["taskState"]) => {
  const label: Record<GelatoTask["taskState"], string> = {
    CheckPending: "Pending",
    WaitingForConfirmation: "Waiting confirmations",
    ExecPending: "Executing",
    ExecSuccess: "Success",
    Cancelled: "Cancelled",
  };

  return label[taskStatus];
};