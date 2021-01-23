import setuptools

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setuptools.setup(
    name="piwwwaterflow",
    version="0.0.5",
    author="Ismael Raya",
    author_email="phornee@gmail.com",
    description="Raspberry Pi Waterflow Web interface",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/Phornee/piwwwaterflow",
    packages=setuptools.find_packages(),
    include_package_data=True,
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: POSIX :: Linux",
        "Topic :: Home Automation"
    ],
    install_requires=[
        'piwaterflow>=0.0.5',
        'Flask>=1.1.2'
    ],
    python_requires='>=3.6',
)