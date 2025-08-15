from django.http import JsonResponse
from django.shortcuts import render


def info(request):
	return JsonResponse({"message": "Hello from Bolt Ride Partner backend!"})
