import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

type CSVFileImportProps = {
  url: string;
  title: string;
};

export default function CSVFileImport({ url, title }: CSVFileImportProps) {
  const [file, setFile] = React.useState<File>();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFile(file);
    }
  };

  const removeFile = () => {
    setFile(undefined);
  };

  const uploadFile = async () => {
    if (!file) return;

    console.log("uploadFile to", url);

    try {
      // Get authorization token from localStorage
      const authorizationToken = localStorage.getItem("authorization_token");

      if (!authorizationToken) {
        console.error("Authorization token not found in localStorage");
        alert("Authorization token not found. Please log in first.");
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", file);

      // Make request with Basic Authorization header
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${authorizationToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const result = await response.json();
      console.log("Upload successful:", result);
      alert("File uploaded successfully!");
      setFile(undefined);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert(`Error uploading file: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {!file ? (
        <input type="file" onChange={onFileChange} />
      ) : (
        <div>
          <button onClick={removeFile}>Remove file</button>
          <button onClick={uploadFile}>Upload file</button>
        </div>
      )}
    </Box>
  );
}
