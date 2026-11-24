"use server";

export async function createReportAction(params: any): Promise<{ success: boolean; data?: any; error?: string; message?: string }> {
  return { success: true, message: "Report submitted" };
}
