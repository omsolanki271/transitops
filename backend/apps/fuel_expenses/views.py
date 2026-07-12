from rest_framework import viewsets, status
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from core.response import standard_response
from .models import FuelLog, Expense
from .serializers import FuelLogSerializer, ExpenseSerializer
from core.permissions import CanAccessFuelExpenses
from .services import create_fuel_log, create_expense

class FuelLogViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling Fuel Log CRUD operations.
    Enforces business logic in the service layer.
    """
    queryset = FuelLog.objects.all()
    serializer_class = FuelLogSerializer
    permission_classes = [CanAccessFuelExpenses]
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter)
    filterset_fields = ('vehicle', 'trip')
    search_fields = ('vehicle__registration_number',)
    ordering = ('-log_date',)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return standard_response(success=True, data=serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return standard_response(success=True, data=serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        log = create_fuel_log(serializer.validated_data, request.user)
        return standard_response(success=True, data=self.get_serializer(log).data, status_code=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        log = serializer.save()
        return standard_response(success=True, data=self.get_serializer(log).data, status_code=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return standard_response(success=True, data={"message": "Fuel log deleted successfully."}, status_code=status.HTTP_200_OK)


class ExpenseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling Expense CRUD operations.
    Enforces business logic in the service layer.
    """
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [CanAccessFuelExpenses]
    filter_backends = (DjangoFilterBackend, SearchFilter, OrderingFilter)
    filterset_fields = ('vehicle', 'expense_type')
    search_fields = ('vehicle__registration_number', 'description')
    ordering = ('-expense_date',)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return standard_response(success=True, data=serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return standard_response(success=True, data=serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        expense = create_expense(serializer.validated_data, request.user)
        return standard_response(success=True, data=self.get_serializer(expense).data, status_code=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        expense = serializer.save()
        return standard_response(success=True, data=self.get_serializer(expense).data, status_code=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return standard_response(success=True, data={"message": "Expense deleted successfully."}, status_code=status.HTTP_200_OK)
