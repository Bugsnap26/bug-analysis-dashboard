import React, { useEffect, useState } from "react";
import {
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Stack,
  Paper,
  IconButton,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import ArticleIcon from "@mui/icons-material/Article";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";

const Dashboard = () => {
  const [blobs, setBlobs] = useState([]);
  const [pairs, setPairs] = useState([]);
  const [selectedBlob, setSelectedBlob] = useState(null);

  // Fetch blobs from API
  const fetchBlobs = async () => {
    try {
      const res = await fetch("/api/listBlob");
      const data = await res.json();
      setBlobs(data);
    } catch (err) {
      console.error("Failed to load blobs:", err);
    }
  };

  useEffect(() => {
    fetchBlobs();
  }, []);

  // Pair video + JSON by session prefix
  useEffect(() => {
    if (blobs.length === 0) return;

    const videoFiles = blobs.filter(
      (b) =>
        b.pathname.includes("video") &&
        (b.pathname.endsWith(".mp4") ||
          b.pathname.endsWith(".webm") ||
          b.pathname.endsWith(".ogg"))
    );

    const jsonFiles = blobs.filter(
      (b) => b.pathname.includes("report") && b.pathname.endsWith(".json")
    );

    const sessionPairs = videoFiles.map((video) => {
      const match = video.pathname.match(
        /\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/
      );
      const sessionId = match ? match[0] : null;

      const jsonMatch = jsonFiles.find(
        (json) => sessionId && json.pathname.includes(sessionId)
      );

      return { video, json: jsonMatch || null, sessionId };
    });

    const unmatchedJSONs = jsonFiles
      .filter((json) => {
        const match = json.pathname.match(
          /\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/
        );
        const sessionId = match ? match[0] : null;
        return !sessionPairs.some((p) => p.sessionId === sessionId);
      })
      .map((json) => ({ video: null, json, sessionId: json.pathname }));

    setPairs([...sessionPairs, ...unmatchedJSONs]);
  }, [blobs]);

  const handleDownload = async (file) => {
    if (!file) return;
    try {
      const res = await fetch(file.url);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = file.pathname;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  const renderSelectedBlob = () => {
    if (!selectedBlob) return null;

    // Video formats
    if (
      selectedBlob.pathname.endsWith(".mp4") ||
      selectedBlob.pathname.endsWith(".webm") ||
      selectedBlob.pathname.endsWith(".ogg")
    ) {
      return (
        <video
          controls
          style={{ maxWidth: "90%", maxHeight: "80%", borderRadius: 8 }}
        >
          <source src={selectedBlob.url} />
          Your browser does not support the video tag.
        </video>
      );
    }

    // JSON viewer using iframe
    if (selectedBlob.pathname.endsWith(".json")) {
      return (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            maxHeight: "80vh",
            borderRadius: 2,
            overflow: "auto",
          }}
        >
          <iframe
            src={selectedBlob.url}
            title="json-viewer"
            style={{ width: "100%", height: "100%", border: "none" }}
          />
        </Box>
      );
    }

    return <Typography>Unsupported file type</Typography>;
  };

  return (
    <Box className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <Box
        sx={{
          backgroundColor: "#1976d2",
          color: "white",
          py: 3,
          px: 2,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontWeight: "bold",
          fontSize: "1.5rem",
          borderBottom: "2px solid #1565c0",
          position: "relative",
        }}
      >
        Bug Analysis Dashboard
      </Box>

      {/* Refresh Button */}
      <Box sx={{ p: 2 }}>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          sx={{ backgroundColor: "lightgreen", color: "#000" }}
          onClick={fetchBlobs}
        >
          Refresh
        </Button>
      </Box>

      {/* Table */}
      <Box sx={{ flex: 1, p: 2 }}>
        <Table component={Paper}>
          <TableHead>
            <TableRow>
              <TableCell>Session</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pairs.map((pair, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <Stack direction="row" spacing={2}>
                    {pair.video ? (
                      <Typography
                        onClick={() => setSelectedBlob(pair.video)}
                        sx={{
                          cursor: "pointer",
                          color: "#1976d2",
                          fontWeight: "bold",
                        }}
                      >
                        ▶️ {pair.video.pathname}
                      </Typography>
                    ) : (
                      <Typography sx={{ color: "red" }}>Missing Video</Typography>
                    )}
                    {pair.json ? (
                      <Typography
                        onClick={() => setSelectedBlob(pair.json)}
                        sx={{
                          cursor: "pointer",
                          color: "#1976d2",
                          fontWeight: "bold",
                        }}
                      >
                        📄 {pair.json.pathname}
                      </Typography>
                    ) : (
                      <Typography sx={{ color: "red" }}>Missing JSON</Typography>
                    )}
                  </Stack>
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    {pair.video && (
                      <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownload(pair.video)}
                      >
                        Video
                      </Button>
                    )}
                    {pair.json && (
                      <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownload(pair.json)}
                      >
                        JSON
                      </Button>
                    )}
                    <Button variant="outlined" startIcon={<ArticleIcon />}>
                      Summarize
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {/* Viewer Modal */}
      {selectedBlob && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <Paper
            sx={{
              position: "relative",
              p: 3,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              width: "90%",
              height: "90%",
            }}
          >
            <IconButton
              sx={{ position: "absolute", top: 8, right: 8 }}
              onClick={() => setSelectedBlob(null)}
            >
              <CloseIcon />
            </IconButton>
            {renderSelectedBlob()}
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;
