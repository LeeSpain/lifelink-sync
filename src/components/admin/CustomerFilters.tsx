import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X, Users, Globe, CreditCard, Calendar } from "lucide-react";

interface CustomerFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onFiltersChange: (filters: FilterState) => void;
}

interface FilterState {
  country: string;
  subscriptionStatus: string;
  registrationDate: string;
  orderStatus: string;
}

export function CustomerFilters({ searchTerm, onSearchChange, onFiltersChange }: CustomerFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    country: "",
    subscriptionStatus: "",
    registrationDate: "",
    orderStatus: ""
  });

  const countries = ["Spain", "Netherlands", "Germany", "France", "Italy", "United Kingdom"];
  const subscriptionStatuses = ["Active", "Inactive", "Cancelled", "Expired"];
  const dateRanges = ["Last 7 days", "Last 30 days", "Last 3 months", "Last 6 months", "Last year"];
  const orderStatuses = ["Completed", "Pending", "Cancelled", "Refunded"];

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilter = (key: keyof FilterState) => {
    handleFilterChange(key, "");
  };

  const clearAllFilters = () => {
    const emptyFilters = {
      country: "",
      subscriptionStatus: "",
      registrationDate: "",
      orderStatus: ""
    };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
    onSearchChange("");
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== "").length + (searchTerm ? 1 : 0);

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Search and Filter Toggle */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search customers by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Advanced Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
              
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: "{searchTerm}"
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => onSearchChange("")}
                  />
                </Badge>
              )}
              {filters.country && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {filters.country}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => clearFilter("country")}
                  />
                </Badge>
              )}
              {filters.subscriptionStatus && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {filters.subscriptionStatus}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => clearFilter("subscriptionStatus")}
                  />
                </Badge>
              )}
              {filters.registrationDate && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {filters.registrationDate}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => clearFilter("registrationDate")}
                  />
                </Badge>
              )}
              {filters.orderStatus && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  {filters.orderStatus}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-destructive" 
                    onClick={() => clearFilter("orderStatus")}
                  />
                </Badge>
              )}
            </div>
          )}

          {/* Expanded Filters */}
          {isExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Country
                </label>
                <Select value={filters.country} onValueChange={(value) => handleFilterChange("country", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All countries</SelectItem>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Subscription Status
                </label>
                <Select value={filters.subscriptionStatus} onValueChange={(value) => handleFilterChange("subscriptionStatus", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    {subscriptionStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Registration Date
                </label>
                <Select value={filters.registrationDate} onValueChange={(value) => handleFilterChange("registrationDate", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All time</SelectItem>
                    {dateRanges.map((range) => (
                      <SelectItem key={range} value={range}>
                        {range}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Order Status
                </label>
                <Select value={filters.orderStatus} onValueChange={(value) => handleFilterChange("orderStatus", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All orders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All orders</SelectItem>
                    {orderStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}