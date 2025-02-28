from passlib.hash import bcrypt

def hash_password(password: str) -> str:
    """
    비밀번호를 해싱합니다.
    
    Args:
        password: 해싱할 원본 비밀번호
        
    Returns:
        해싱된 비밀번호
    """
    return bcrypt.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    비밀번호가 해시와 일치하는지 검증합니다.
    
    Args:
        plain_password: 검증할 원본 비밀번호
        hashed_password: 저장된 해시 비밀번호
        
    Returns:
        비밀번호가 일치하면 True, 그렇지 않으면 False
    """
    return bcrypt.verify(plain_password, hashed_password) 