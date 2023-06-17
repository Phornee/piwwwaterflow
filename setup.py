""" Pypi stup """
import setuptools

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setuptools.setup(
    name="piwwwaterflow",
    version="0.1.9",
    author="Ismael Raya",
    author_email="phornee@gmail.com",
    description="Raspberry Pi Waterflow resilient system",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/Phornee/piwwwaterflow",
    packages=setuptools.find_packages(),
    include_package_data=True,
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Topic :: Home Automation",
    ],
    install_requires=[
        'Flask>=1.1.2',
        'flask-compress>=1.9.0',
        'importlib-metadata>=4.5.0',
        'python-socketio>=5.8.0',
        'flask-socketio>=5.3.3',
        'eventlet==0.30.2', # Exact version required 0.30.2
        'piwaterflow>=0.5.11',
        'revproxy_auth>=0.1.7'
    ],
    python_requires='>=3.6',
)