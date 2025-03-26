import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { JobApplication } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface DashboardStats {
  totalApplications: number;
  interviewsScheduled: number;
  responseRate: number;
  daysInSearch: number;
  applicationsByStatus: {
    applied: number;
    interview: number;
    offer: number;
    rejected: number;
  };
}

export function AnalyticsView() {
  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  const { data: applications, isLoading: isLoadingApplications } = useQuery<JobApplication[]>({
    queryKey: ["/api/applications"],
  });

  // Process data for status pie chart
  const statusChartData = useMemo(() => {
    if (!stats) return [];
    
    return [
      { name: "Applied", value: stats.applicationsByStatus.applied, color: "#0A66C2" },
      { name: "Interview", value: stats.applicationsByStatus.interview, color: "#0A66C2" },
      { name: "Offer", value: stats.applicationsByStatus.offer, color: "#057642" },
      { name: "Rejected", value: stats.applicationsByStatus.rejected, color: "#FF6B6B" },
    ].filter(item => item.value > 0);
  }, [stats]);

  // Process data for application trends (by month)
  const applicationTrendsData = useMemo(() => {
    if (!applications) return [];
    
    const monthMap = new Map();
    
    applications.forEach(app => {
      const date = new Date(app.appliedDate!);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      
      if (!monthMap.has(monthYear)) {
        monthMap.set(monthYear, 0);
      }
      
      monthMap.set(monthYear, monthMap.get(monthYear) + 1);
    });
    
    // Convert map to array and sort by date
    return Array.from(monthMap, ([name, value]) => ({ name, value }))
      .sort((a, b) => {
        const [aMonth, aYear] = a.name.split(' ');
        const [bMonth, bYear] = b.name.split(' ');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const yearDiff = parseInt(aYear) - parseInt(bYear);
        if (yearDiff !== 0) return yearDiff;
        
        return months.indexOf(aMonth) - months.indexOf(bMonth);
      });
  }, [applications]);

  // Salary insights data
  const salaryInsightsData = [
    { name: "Junior", yourOffer: 80000, marketAvg: 75000 },
    { name: "Mid-level", yourOffer: 110000, marketAvg: 105000 },
    { name: "Senior", yourOffer: 150000, marketAvg: 140000 },
  ];

  // Industry demand data
  const industryDemandData = [
    { name: "Frontend Development", value: 85, demand: "High Demand" },
    { name: "Backend Development", value: 80, demand: "High Demand" },
    { name: "DevOps", value: 75, demand: "High Demand" },
    { name: "Data Science", value: 65, demand: "Medium Demand" },
    { name: "UX/UI Design", value: 60, demand: "Medium Demand" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Application Trends */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-[#2C3E50]">Application Trends</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoadingApplications ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={applicationTrendsData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0A66C2" name="Applications" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-4 text-sm text-gray-600">
            <p>
              {applicationTrendsData.length > 1 ? (
                <span>
                  Your application rate has 
                  {applicationTrendsData[applicationTrendsData.length - 1].value >= 
                   applicationTrendsData[applicationTrendsData.length - 2].value ? (
                    <span className="text-[#057642] font-medium"> increased</span>
                  ) : (
                    <span className="text-[#FF6B6B] font-medium"> decreased</span>
                  )} compared to last month.
                </span>
              ) : (
                <span>Start tracking your applications to see trends.</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Response Rates */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-[#2C3E50]">Response Rates</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoadingStats ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} applications`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-4 text-sm text-gray-600">
            <p>
              {stats ? (
                <>
                  Your interview conversion rate is <span className="text-[#0A66C2] font-medium">{stats.responseRate}%</span>
                  {stats.responseRate >= 30 ? (
                    <span>, which is <span className="text-[#057642] font-medium">5%</span> above the industry average.</span>
                  ) : (
                    <span>. Keep improving your applications to increase your success rate.</span>
                  )}
                </>
              ) : (
                <span>Start tracking your applications to see response rates.</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Salary Insights */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-[#2C3E50]">Salary Insights</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={salaryInsightsData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                <Legend />
                <Line type="monotone" dataKey="yourOffer" stroke="#0A66C2" activeDot={{ r: 8 }} name="Your Offers" />
                <Line type="monotone" dataKey="marketAvg" stroke="#9AA5B1" strokeDasharray="5 5" name="Market Average" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>Your current offers average <span className="text-[#0A66C2] font-medium">$115,000</span>, which is <span className="text-[#057642] font-medium">12%</span> above market rate for your experience level.</p>
          </div>
        </CardContent>
      </Card>
      
      {/* Industry Demand */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-[#2C3E50]">Industry Demand</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {industryDemandData.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className={`text-sm font-medium ${
                    item.demand === "High Demand" ? "text-[#057642]" : "text-[#0A66C2]"
                  }`}>
                    {item.demand}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div 
                    className={`h-2 rounded-full ${
                      item.demand === "High Demand" ? "bg-[#057642]" : "bg-[#0A66C2]"
                    }`} 
                    style={{ width: `${item.value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>Your primary skills align with <span className="text-[#057642] font-medium">high-demand</span> areas in the current job market.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
