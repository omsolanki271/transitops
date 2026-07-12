from .base import *

DEBUG = True

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'HOST': os.environ.get('DB_HOST', '127.0.0.1'),
        'PORT': int(os.environ.get('DB_PORT', '3307')),
        'USER': os.environ.get('DB_USER', 'root'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'abc123'),
        'NAME': os.environ.get('DB_NAME', 'transitops'),
        'OPTIONS': {
            'charset': 'utf8mb4',
        }
    }
}
