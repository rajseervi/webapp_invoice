"use client";
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/firebase/config";
import DashboardLayout from "@/components/DashboardLayout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

export default function ManagePermissionsPage() {
  const { userRole } = useAuth();
  const router = useRouter();

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    module: "",
  });

  useEffect(() => {
    if (userRole !== "admin") {
      router.push("/unauthorized");
    }
  }, [userRole, router]);

  useEffect(() => {
    fetchPermissions();
    // eslint-disable-next-line
  }, []);

  const fetchPermissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const permissionsRef = collection(db, "permissions");
      const snapshot = await getDocs(permissionsRef);
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Permission[];
      setPermissions(list);
    } catch (err) {
      setError("Failed to fetch permissions.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (permission?: Permission) => {
    if (permission) {
      setIsEditing(true);
      setSelectedPermission(permission);
      setFormData({
        name: permission.name,
        description: permission.description,
        module: permission.module,
      });
    } else {
      setIsEditing(false);
      setSelectedPermission(null);
      setFormData({ name: "", description: "", module: "" });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPermission(null);
    setFormData({ name: "", description: "", module: "" });
    setError(null);
    setSuccess(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.module.trim()) {
      setError("Name and module are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isEditing && selectedPermission) {
        const ref = doc(db, "permissions", selectedPermission.id);
        await updateDoc(ref, {
          name: formData.name,
          description: formData.description,
          module: formData.module,
        });
        setSuccess("Permission updated.");
      } else {
        await addDoc(collection(db, "permissions"), {
          name: formData.name,
          description: formData.description,
          module: formData.module,
        });
        setSuccess("Permission created.");
      }
      fetchPermissions();
      handleCloseDialog();
    } catch (err) {
      setError("Failed to save permission.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (permission: Permission) => {
    if (!window.confirm("Delete this permission?")) return;
    setLoading(true);
    setError(null);
    try {
      await deleteDoc(doc(db, "permissions", permission.id));
      setSuccess("Permission deleted.");
      fetchPermissions();
    } catch (err) {
      setError("Failed to delete permission.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h4">Manage Permissions</Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchPermissions}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Permission
            </Button>
          </Box>
        </Box>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Paper>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Module</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {permissions.map((perm) => (
                    <TableRow key={perm.id}>
                      <TableCell>{perm.name}</TableCell>
                      <TableCell>{perm.description}</TableCell>
                      <TableCell>{perm.module}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleOpenDialog(perm)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton color="error" onClick={() => handleDelete(perm)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {permissions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No permissions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
          <DialogTitle>{isEditing ? "Edit Permission" : "Add Permission"}</DialogTitle>
          <DialogContent>
            <Box component="form" sx={{ mt: 1 }}>
              <TextField
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                margin="normal"
                required
              />
              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Module"
                name="module"
                value={formData.module}
                onChange={handleChange}
                fullWidth
                margin="normal"
                required
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={loading} startIcon={<CancelIcon />}>
              Cancel
            </Button>
            <Button onClick={handleSave} variant="contained" disabled={loading} startIcon={<SaveIcon />}>
              {isEditing ? "Save Changes" : "Create"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </DashboardLayout>
  );
}