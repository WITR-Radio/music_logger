from netaddr import IPNetwork, IPAddress

def in_subnet(addr):
    """ Simple function to return True if IP is in the WITR subnet
        and False if it is not
    """
    print(addr)
    return IPAddress(addr) in IPNetwork('129.21.97.0/26') or IPAddress(addr) in IPNetwork('127.0.0.1/24')
