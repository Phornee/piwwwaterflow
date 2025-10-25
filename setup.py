""" Pypi stup """
import os
import re
import setuptools

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

def get_version():
    """ Gets version string from the init file
    Returns:
        str: Version string
    """
    version_file = os.path.join('piwwwaterflow', '__init__.py')
    with open(version_file, 'r',  encoding="utf-8") as initfile_lines:
        version = re.search(r'__version__ = ["|\'](.*?)["|\']', initfile_lines.read()).group(1)
        return version
    raise RuntimeError(f'Unable to find version string in {version_file}.')

setuptools.setup(
    name="piwwwaterflow",
    version=get_version(),
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
        'Flask==3.1.0', #3.1.0
        'flask-compress',
        'importlib-metadata',
        'piwaterflow>=1.0.0',
        'revproxy_auth>=0.1.16',
    ],
    python_requires='>=3.8',
)