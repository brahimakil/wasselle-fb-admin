import { 
  collection, 
  query, 
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone: string;
  issue: string;
  description: string;
  reportedPersonName?: string;
  reportedPersonPhone?: string;
  reportedPersonEmail?: string;
  reportedPersonCountry?: string;
  reportedPersonCity?: string;
  reportedVehiclePlate?: string;
  reportedPersonDetails?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  adminResponse?: string;
  adminId?: string;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt?: Date;
}

export const ReportService = {
  // Get all reports
  async getAllReports(): Promise<Report[]> {
    try {
      const reportsQuery = query(
        collection(db, 'reports'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(reportsQuery);
      const reports: Report[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reports.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          reviewedAt: data.reviewedAt?.toDate(),
        } as Report);
      });

      return reports;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  },

  // Get reports by status
  async getReportsByStatus(status: 'pending' | 'reviewed' | 'resolved'): Promise<Report[]> {
    try {
      const reportsQuery = query(
        collection(db, 'reports'),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(reportsQuery);
      const reports: Report[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reports.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          reviewedAt: data.reviewedAt?.toDate(),
        } as Report);
      });

      return reports;
    } catch (error) {
      console.error('Error fetching reports by status:', error);
      throw error;
    }
  },

  // Update report with admin response
  async updateReport(
    reportId: string,
    adminResponse: string,
    status: 'reviewed' | 'resolved',
    adminId: string,
    reporterId: string
  ): Promise<void> {
    try {
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, {
        adminResponse,
        status,
        adminId,
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Send notification to the reporter
      const notificationRef = collection(db, 'notifications');
      await addDoc(notificationRef, {
        userId: reporterId,
        title: 'Report Update',
        titleAr: 'تحديث البلاغ',
        titleEs: 'Actualización del Informe',
        message: `Your report has been ${status}. Admin response: ${adminResponse}`,
        messageAr: `تم ${status === 'reviewed' ? 'مراجعة' : 'حل'} بلاغك. رد المسؤول: ${adminResponse}`,
        messageEs: `Tu informe ha sido ${status === 'reviewed' ? 'revisado' : 'resuelto'}. Respuesta del administrador: ${adminResponse}`,
        type: 'report_update',
        isRead: false,
        createdAt: serverTimestamp(),
        data: {
          reportId,
          status,
        }
      });
    } catch (error) {
      console.error('Error updating report:', error);
      throw error;
    }
  },
};
